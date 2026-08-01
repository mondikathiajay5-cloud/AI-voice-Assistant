import { v4 as uuidv4 } from 'uuid';
import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { rooms, roomBookings } from '../data/mockData.js';

export async function listRooms() {
  if (isDatabaseConfigured) {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) throw new Error(`rooms query failed: ${error.message}`);
    return data;
  }
  return rooms;
}

/**
 * Book a room. Returns { success, booking } or { success: false, reason }.
 * The unique constraint on (room, date, start_time) in Postgres is the real
 * guard against double-booking; here we replicate that check in memory too.
 */
export async function bookRoom({ roomName, date, startTime, endTime, studentId }) {
  if (isDatabaseConfigured) {
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id')
      .ilike('name', roomName)
      .single();
    if (roomErr || !room) return { success: false, reason: 'Room not found.' };

    const { data, error } = await supabase
      .from('room_bookings')
      .insert({ room_id: room.id, student_id: studentId, booking_date: date, start_time: startTime, end_time: endTime })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, reason: 'That room is already booked for that slot.' };
      throw new Error(`room_bookings insert failed: ${error.message}`);
    }
    return { success: true, booking: data };
  }

  const room = rooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());
  if (!room) return { success: false, reason: `No room found matching "${roomName}".` };

  const conflict = roomBookings.find(
    (b) => b.roomId === room.id && b.date === date && b.startTime === startTime && b.status === 'confirmed'
  );
  if (conflict) return { success: false, reason: 'That room is already booked for that slot.' };

  const booking = {
    id: uuidv4(),
    roomId: room.id,
    roomName: room.name,
    studentId: studentId || null,
    date,
    startTime,
    endTime,
    status: 'confirmed',
  };
  roomBookings.push(booking);
  return { success: true, booking };
}

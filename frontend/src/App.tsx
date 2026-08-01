import ChatWindow from './components/ChatWindow';

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-campus-mist via-white to-campus-mist p-4">
      <div className="h-[92vh] w-full max-w-3xl">
        <ChatWindow />
      </div>
    </div>
  );
}

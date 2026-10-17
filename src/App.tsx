import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { GameProvider, useGame } from './context/GameContext.js';
import { HorrorMusicProvider, useHorrorMusic } from './context/HorrorMusicContext.js';
import { Navbar } from './components/Navbar.js';
import { LoginView } from './components/LoginView.js';
import { GlobalChatHome } from './components/GlobalChatHome.js';
import { JoinRoomModal } from './components/JoinRoomModal.js';
import { CreateRoomModal } from './components/CreateRoomModal.js';
import { HostDashboardModal } from './components/HostDashboardModal.js';
import { RoomLobbyView } from './components/RoomLobbyView.js';
import { RoundHintsView } from './components/RoundHintsView.js';
import { RoundDiscussionView } from './components/RoundDiscussionView.js';
import { VotingView } from './components/VotingView.js';
import { TieResultView } from './components/TieResultView.js';
import { WinnerResultView } from './components/WinnerResultView.js';
import { Shield } from 'lucide-react';

function MainApp() {
  const { user, isLoading, room } = useGame();
  const { autoGameAdapt, setMood } = useHorrorMusic();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHostDashboardOpen, setIsHostDashboardOpen] = useState(false);

  // Auto-adapt horror theme music tension to the game phase
  useEffect(() => {
    if (!autoGameAdapt) return;
    if (!room) {
      setMood('dread');
      return;
    }

    switch (room.phase) {
      case 'VOTING':
      case 'TIE_RESULT':
        setMood('terror'); // Full terror during voting / accusation
        break;
      case 'ROUND_1_DISCUSSION':
      case 'ROUND_2_DISCUSSION':
      case 'ROUND_3_DISCUSSION':
        setMood('suspense'); // Heartbeat paranoia during interrogation
        break;
      case 'ROUND_1_HINTS':
      case 'ROUND_2_HINTS':
      case 'ROUND_3_HINTS':
        setMood('dread');
        break;
      case 'LOBBY':
      case 'RESULTS':
      default:
        setMood('dread');
        break;
    }
  }, [room?.phase, autoGameAdapt, setMood]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4 transition-colors duration-300">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80 flex items-center justify-center animate-spin">
          <Shield className="w-6 h-6 text-red-500" />
        </div>
        <span className="font-mono text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">
          INITIALIZING SPY NETWORK...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderRoomContent = () => {
    if (!room) return null;

    switch (room.phase) {
      case 'LOBBY':
        return <RoomLobbyView />;
      case 'ROUND_1_HINTS':
        return <RoundHintsView roundNumber={1} />;
      case 'ROUND_1_DISCUSSION':
        return <RoundDiscussionView roundNumber={1} />;
      case 'ROUND_2_HINTS':
        return <RoundHintsView roundNumber={2} />;
      case 'ROUND_2_DISCUSSION':
        return <RoundDiscussionView roundNumber={2} />;
      case 'ROUND_3_HINTS':
        return <RoundHintsView roundNumber={3} />;
      case 'ROUND_3_DISCUSSION':
        return <RoundDiscussionView roundNumber={3} />;
      case 'VOTING':
        return <VotingView />;
      case 'TIE_RESULT':
        return <TieResultView />;
      case 'RESULTS':
        return <WinnerResultView />;
      default:
        return <RoomLobbyView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-red-500/30 selection:text-white transition-colors duration-300">
      <Navbar onOpenHostDashboard={() => setIsHostDashboardOpen(true)} />

      <main className="flex-1">
        {!room ? (
          <GlobalChatHome
            onOpenJoinModal={() => setIsJoinModalOpen(true)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenHostDashboard={() => setIsHostDashboardOpen(true)}
          />
        ) : (
          renderRoomContent()
        )}
      </main>

      {/* Global Modals */}
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <HostDashboardModal
        isOpen={isHostDashboardOpen}
        onClose={() => setIsHostDashboardOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HorrorMusicProvider>
        <GameProvider>
          <MainApp />
        </GameProvider>
      </HorrorMusicProvider>
    </ThemeProvider>
  );
}


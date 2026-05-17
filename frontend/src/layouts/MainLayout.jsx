import { Outlet } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export default function MainLayout() {
  return (
    <div className="h-full flex flex-col bg-[#0F1923]">
      <TopBar />
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

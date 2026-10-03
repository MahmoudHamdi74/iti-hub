import { Outlet } from 'react-router-dom';
import LoginRequiredModal from '@components/auth/LoginRequiredModal';

export default function RouteShell() {
  return <><Outlet /><LoginRequiredModal /></>;
}

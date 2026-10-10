import { Outlet } from 'react-router-dom';
import LoginRequiredModal from '@components/auth/LoginRequiredModal';
import PageSeo from '@components/common/PageSeo';

export default function RouteShell() {
  return <><PageSeo /><Outlet /><LoginRequiredModal /></>;
}

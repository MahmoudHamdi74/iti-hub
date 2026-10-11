import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Profile from '../src/components/profile/Profile';
const data=vi.hoisted(()=>({total:1}));
vi.mock('react-router-dom',()=>({useParams:()=>({username:'mahmoud'})}));
vi.mock('@store/auth',()=>({useAuthStore:select=>select({user:{_id:'me'}})}));
vi.mock('react-intlayer',()=>({useIntlayer:()=>({})}));
vi.mock('@hooks/queries/useUserQueries',()=>({useGetUserProfile:()=>({data:{data:{_id:'me',username:'mahmoud',postsCount:-2}}}),useGetUserPosts:()=>({data:{data:{pagination:{total:data.total}}}})}));
vi.mock('../src/components/profile/ProfileHeader',()=>({default:()=>null}));
vi.mock('../src/components/profile/ProfileInfo',()=>({default:({profile})=><span data-testid="profile-total">{profile.postsCount}</span>}));
vi.mock('../src/components/profile/ProfilePosts',()=>({default:()=>null}));
afterEach(cleanup);
test('profile count uses real paginated total instead of legacy negative counter',()=>{
 data.total=1; const {rerender}=render(<Profile/>);expect(screen.getByTestId('profile-total').textContent).toBe('1');
 data.total=31;rerender(<Profile/>);expect(screen.getByTestId('profile-total').textContent).toBe('31');
 data.total=0;rerender(<Profile/>);expect(screen.getByTestId('profile-total').textContent).toBe('0');
 data.total=undefined;rerender(<Profile/>);expect(screen.getByTestId('profile-total').textContent).toBe('');
});

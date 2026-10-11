import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, renderHook, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import useIntersectionObserver from '../src/hooks/useIntersectionObserver';
import MessageItem from '../src/components/messaging/MessageItem';
import NotificationItem from '../src/components/notifications/NotificationItem';
import MessageInput from '../src/components/messaging/MessageInput';
import CommunitySettings from '../src/components/community/CommunitySettings';
import useCreatePost from '../src/hooks/mutations/useCreatePost';
const api=vi.hoisted(()=>({post:vi.fn(),get:vi.fn()}));
vi.mock('@lib/api',()=>({default:api}));
vi.mock('@store/auth',()=>({useAuthStore:select=>select({user:{_id:'me'}})}));
vi.mock('../src/utils/notificationHelpers',()=>({formatNotificationTime:()=> 'now'}));
vi.mock('react-intlayer',()=>({useLocale:()=>({locale:'en'}),useIntlayer:()=>({reply:{value:'Reply'},replyTo:{value:'Reply to'},cancelReply:{value:'Cancel reply'},photo:{value:'Photo'},delivered:{value:'Delivered'},messageInputPlaceholder:{value:'Message'},sendButton:{value:'Send'},attachImage:{value:'Attach image'},settings:'Settings',communityName:'Name',aboutCommunity:'About',savee:'Save',cancel:{value:'Close'},unknownUser:{value:'Unknown'}})}));
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});
test('observer mounts after loader and does not drain pages on rerenders',async()=>{
 const callbacks=[];vi.stubGlobal('IntersectionObserver',class{constructor(cb){callbacks.push(cb);}observe(){}disconnect(){}});
 const fetch=vi.fn();function List({ready}){const {observerTarget}=useIntersectionObserver({onIntersect:()=>fetch()});return ready?<div ref={observerTarget}>End</div>:null;}
 const {rerender}=render(<List ready={false}/>);rerender(<List ready/>);
 await act(async()=>callbacks.at(-1)([{isIntersecting:true}]));expect(fetch).toHaveBeenCalledTimes(1);
 rerender(<List ready/>);await act(async()=>callbacks.at(-1)([{isIntersecting:true}]));expect(fetch).toHaveBeenCalledTimes(1);
 await act(async()=>callbacks.at(-1)([{isIntersecting:false}]));await act(async()=>callbacks.at(-1)([{isIntersecting:true}]));expect(fetch).toHaveBeenCalledTimes(2);
});
test('right click and horizontal mobile swipe select a message reply',()=>{
 const reply=vi.fn(), message={_id:'one',content:'Hello',createdAt:new Date().toISOString(),sender:{_id:'other'}};
 const {container}=render(<MessageItem message={message} onReply={reply}/>);
 const bubble=container.querySelector('[data-message-id]');fireEvent.contextMenu(bubble);fireEvent.click(screen.getByText('Reply'));expect(reply).toHaveBeenCalledWith(message);
 fireEvent.touchStart(bubble,{touches:[{clientX:20,clientY:20}]});fireEvent.touchEnd(bubble,{changedTouches:[{clientX:100,clientY:24}]});expect(reply).toHaveBeenCalledTimes(2);
 fireEvent.touchStart(bubble,{touches:[{clientX:20,clientY:20}]});fireEvent.touchEnd(bubble,{changedTouches:[{clientX:25,clientY:120}]});expect(reply).toHaveBeenCalledTimes(2);
});
test('failed sending retains message input',async()=>{
 const change=vi.fn(), send=vi.fn().mockRejectedValue(new Error('offline'));
 render(<MessageInput value="Keep this draft" onChange={change} onSend={send}/>);
 fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter'});await waitFor(()=>expect(send).toHaveBeenCalled());expect(change).not.toHaveBeenCalled();
});
test('community settings submit name and retain form on failure',async()=>{
 const save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({}),close=vi.fn();
 render(<CommunitySettings community={{name:'Before',description:'Description'}} onSave={save} onClose={close}/>);
 fireEvent.change(screen.getByLabelText('Name'),{target:{value:'After'}});fireEvent.click(screen.getByText('Save'));
 await screen.findByText('offline');expect(close).not.toHaveBeenCalled();expect(screen.getByLabelText('Name').value).toBe('After');
 fireEvent.click(screen.getByText('Save'));await waitFor(()=>expect(close).toHaveBeenCalled());expect(save).toHaveBeenCalledWith({name:'After',description:'Description'});
});
test('publishing recovers a saved post after a lost response and retries with one request ID',async()=>{
 const client=new QueryClient({defaultOptions:{mutations:{retry:false}}});const wrapper=({children})=><QueryClientProvider client={client}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
 const {result}=renderHook(()=>useCreatePost(),{wrapper});
 api.post.mockRejectedValue(new Error('timeout'));api.get.mockRejectedValueOnce(new Error('offline'));
 await act(async()=>{await expect(result.current.mutateAsync({content:'Post'})).rejects.toHaveProperty('deliveryUncertain',true);});
 const firstId=api.post.mock.calls[0][1].get('clientRequestId');
 api.get.mockResolvedValueOnce({data:{data:{post:{_id:'saved'}}}});
 await act(async()=>{expect(await result.current.mutateAsync({content:'Post'})).toEqual({data:{post:{_id:'saved'}}});});
 expect(api.post.mock.calls[1][1].get('clientRequestId')).toBe(firstId);client.clear();
});

test('long notification names are capped and its icon keeps a fixed box',()=>{
 const notification={_id:'alert',type:'like',actor:{fullName:'Long '.repeat(50)},isRead:true};
 const {container}=render(<MemoryRouter><NotificationItem notification={notification}/></MemoryRouter>);
 expect(container.querySelector('p span').textContent.length).toBeLessThanOrEqual(63);
 expect(container.querySelector('.relative.shrink-0').className).toContain('h-12');
});

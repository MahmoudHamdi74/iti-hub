import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostCard } from '../src/components/post/PostCard';
import { PostHeader } from '../src/components/post/PostHeader';
import CommentItem from '../src/components/comments/CommentItem';

vi.mock('react-intlayer', () => ({ useIntlayer: () => new Proxy({}, { get: (_, key) => String(key) }) }));
vi.mock('../src/components/post/PostComposerModal', () => ({ default: () => null }));
vi.mock('../src/components/post/RepostComposerModal', () => ({ default: () => null }));
vi.mock('../src/components/common/ConfirmDialog', () => ({ default: () => null }));
vi.mock('../src/hooks/queries/useCommentReplies', () => ({ default: () => ({ data: { pages: [{ data: { comments: [{ _id: 'reply', author: null, content: 'Reply survives', createdAt: new Date().toISOString() }] } }] } }) }));
afterEach(cleanup);
const wrap = children => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;

test('null populated post author renders a placeholder instead of crashing', () => {
  const view = render(wrap(<PostCard post={{ _id: 'post', author: null }} />));
  expect(screen.getByText('title')).toBeTruthy();
  view.rerender(wrap(<PostCard post={null} />));
  expect(screen.getByText('title')).toBeTruthy();
});

test('standalone post headers tolerate a removed original post', () => {
  render(wrap(<PostHeader post={null} />));
  expect(screen.getByText('compactMessage')).toBeTruthy();
});

test('comments from deleted accounts remain readable without owner controls', () => {
  render(wrap(<CommentItem comment={{ _id: 'comment', author: null, content: 'Comment survives', createdAt: new Date().toISOString() }} postId="post" />));
  expect(screen.getByText('Comment survives')).toBeTruthy();
  expect(screen.getByText('Deleted account')).toBeTruthy();
  expect(screen.queryByText('deleteComment')).toBeNull();
});

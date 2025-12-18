import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import Swipes from '../app/(tabs)/index';

jest.mock('../src/api/api', () => {
  const responses = [
    { data: { candidates: [
        { user: { id: 2, username: 'u2' }, score: 0 },
        { user: { id: 20, username: 'u20' }, score: 0 },
        { user: { id: 21, username: 'u21' }, score: 0 },
      ], total: 6 } },
    // response that will be turned into a pending promise to simulate prefetch in progress
    { data: { candidates: [{ user: { id: 3, username: 'u3' }, score: 0 }], total: 6 } },
    { data: { candidates: [{ user: { id: 4, username: 'u4' }, score: 0 }], total: 6 } },
    // response for reload after toggling include_swiped
    { data: { candidates: [{ user: { id: 6, username: 'u6' }, score: 0 }], total: 6 } },
  ];
  let call = 0;
  let pendingResolve = null;
  return {
    api: {
      get: jest.fn((url) => {
        // make calls with offset>0 (prefetch) be pending so we can assert loadingMore is shown
        const s = String(url || '');
        if (s.includes('offset=') && !s.includes('offset=0')) {
          return new Promise((res) => { pendingResolve = res; });
        }
        const resp = responses[call] || { data: { candidates: [], total: 3 } };
        call++;
        return Promise.resolve(resp);
      }),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      // expose a helper to resolve the pending prefetch from the test
      _resolvePending: () => { if (pendingResolve) pendingResolve({ data: { candidates: [{ user: { id: 9, username: 'u9' }, score: 0 }], total: 6 } }); },
    },
  };
});

describe('Swipes screen', () => {
  test('loads candidates and buttons trigger swipes', async () => {
    const { getByTestId, getByText } = render(<Swipes />);

    await waitFor(() => getByText('Descubrir'));

    // buttons exist
    const like = getByTestId('like-button');
    const dislike = getByTestId('dislike-button');
    const superlike = getByTestId('superlike-button');

    expect(like).toBeTruthy();
    expect(dislike).toBeTruthy();
    expect(superlike).toBeTruthy();

    // Find the toggle before doing swipes, then press it to reload with include_swiped=false
    const toggle = getByTestId('toggle-include-swiped');
    await act(async () => { fireEvent.press(toggle); });

    // The calls to api.get should include one with include_swiped=false
    const { api } = require('../src/api/api');
    expect(api.get.mock.calls.some((args) => String(args[0]).includes('include_swiped=false'))).toBe(true);

    // Wait for the reload sequence to finish (at least 2 api.get calls: initial + reload)
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThanOrEqual(2));

    // debug: log calls
    console.log('api.get calls:', api.get.mock.calls.map(c => c[0]));

    // Press the like button (existing one) and assert api.post was called
    await act(async () => { fireEvent.press(like); });
    expect(api.post).toHaveBeenCalled();

  });


});
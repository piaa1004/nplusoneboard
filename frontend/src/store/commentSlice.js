import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchComments, compareComments } from '../api.js';

/**
 * 최근 댓글 목록 — 양방향 관계의 N:1 방향(Comment → Post) N+1 데모.
 * 정렬을 바꾸면 한 페이지에 담기는 "서로 다른 게시글 수" 가 달라지고,
 * 그에 따라 추가 쿼리 수도 함께 변하는 것을 볼 수 있다(1차 캐시 효과).
 */
export const loadComments = createAsyncThunk(
  'comments/load',
  ({ strategy, page, size, sort }) => fetchComments({ strategy, page, size, sort })
);

export const runCommentComparison = createAsyncThunk(
  'comments/compare',
  ({ page, size, sort }) => compareComments({ page, size, sort })
);

const commentSlice = createSlice({
  name: 'comments',
  initialState: {
    report: null,
    loading: false,
    error: null,

    strategy: 'naive',
    page: 0,
    size: 10,
    sort: 'id,desc',

    comparison: null,
    comparing: false,
  },
  reducers: {
    setStrategy: (state, action) => { state.strategy = action.payload; },
    setPage: (state, action) => { state.page = action.payload; },
    setSize: (state, action) => { state.size = action.payload; state.page = 0; },
    setSort: (state, action) => { state.sort = action.payload; state.page = 0; },
    clearComparison: (state) => { state.comparison = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadComments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loadComments.fulfilled, (state, action) => { state.loading = false; state.report = action.payload; })
      .addCase(loadComments.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(runCommentComparison.pending, (state) => { state.comparing = true; })
      .addCase(runCommentComparison.fulfilled, (state, action) => { state.comparing = false; state.comparison = action.payload; })
      .addCase(runCommentComparison.rejected, (state, action) => { state.comparing = false; state.error = action.error.message; });
  },
});

export const { setStrategy, setPage, setSize, setSort, clearComparison } = commentSlice.actions;
export default commentSlice.reducer;

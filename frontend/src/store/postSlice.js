import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPosts, comparePosts } from '../api.js';

/**
 * 게시글 목록 상태.
 *
 * 조회에 영향을 주는 변수는 <b>전략</b>과 <b>페이지</b>뿐이다.
 * 검색어·정렬 같은 것을 두지 않은 이유는, 쿼리 수가 달라졌을 때
 * 그 원인이 전략 말고 다른 데 있을 여지를 없애기 위해서다.
 */
export const loadPosts = createAsyncThunk(
  'posts/load',
  ({ strategy, page, size }) => fetchPosts({ strategy, page, size })
);

/** 다섯 전략을 같은 조건으로 모두 실행해 쿼리 수를 비교. */
export const runComparison = createAsyncThunk(
  'posts/compare',
  ({ page, size }) => comparePosts({ page, size })
);

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    report: null,        // { strategy, queryCount, elapsedMs, queries, warnings, content, page }
    loading: false,
    error: null,

    strategy: 'naive',
    page: 0,
    size: 10,

    comparison: null,    // 전략 비교 결과 배열
    comparing: false,
  },
  reducers: {
    setStrategy: (state, action) => { state.strategy = action.payload; },
    setPage: (state, action) => { state.page = action.payload; },
    setSize: (state, action) => { state.size = action.payload; state.page = 0; },
    clearComparison: (state) => { state.comparison = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loadPosts.fulfilled, (state, action) => { state.loading = false; state.report = action.payload; })
      .addCase(loadPosts.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(runComparison.pending, (state) => { state.comparing = true; state.error = null; })
      .addCase(runComparison.fulfilled, (state, action) => { state.comparing = false; state.comparison = action.payload; })
      .addCase(runComparison.rejected, (state, action) => { state.comparing = false; state.error = action.error.message; });
  },
});

export const { setStrategy, setPage, setSize, clearComparison } = postSlice.actions;
export default postSlice.reducer;

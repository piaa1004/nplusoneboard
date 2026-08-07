import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchStrategies } from '../api.js';

/**
 * 전략 카탈로그(탭 이름·설명·코드 스니펫)를 백엔드에서 한 번 받아 보관한다.
 * 설명 문구를 프론트에 하드코딩하지 않으므로 백엔드에 전략을 추가하면 화면이 따라온다.
 */
export const loadStrategies = createAsyncThunk('strategies/load', () => fetchStrategies());

const strategySlice = createSlice({
  name: 'strategies',
  initialState: {
    posts: [],
    comments: [],
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadStrategies.fulfilled, (state, action) => {
        state.posts = action.payload.posts;
        state.comments = action.payload.comments;
        state.loaded = true;
      })
      .addCase(loadStrategies.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export default strategySlice.reducer;

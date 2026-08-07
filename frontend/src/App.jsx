import { Routes, Route, useParams } from 'react-router-dom';
import BoardHome from './pages/BoardHome.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';

/** id 가 바뀌면 상세 페이지를 통째로 새로 마운트해 이전 글의 상태가 남지 않게 한다. */
function KeyedPostDetailPage() {
  const { id } = useParams();
  return <PostDetailPage key={id} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardHome />} />
      <Route path="/posts/:id" element={<KeyedPostDetailPage />} />
    </Routes>
  );
}

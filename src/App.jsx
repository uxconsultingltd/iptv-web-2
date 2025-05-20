// IPTV Web Player – Final Login Flow with Error Handling, Placeholder Credentials, UX Enhancements

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function App() {
  const [serverUrl, setServerUrl] = useState('http://line.ottcdn.net:80');
  const [username, setUsername] = useState('cbfa4abc2f');
  const [password, setPassword] = useState('2da068dcfb39');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('home');
  const [channels, setChannels] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [epg, setEpg] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const videoRef = useRef(null);

  const buildApiUrl = (action) =>
    `/api/player_api?username=${username}&password=${password}&action=${action}`;

  const handleLogin = async () => {
    setLoginError('');
    try {
      const res = await fetch(buildApiUrl('player_api'));
      const data = await res.json();

      if (!data.user_info || data.user_info.status !== 'Active') {
        setLoginError('Invalid login credentials or inactive account.');
        return;
      }

      setChannels(data.live_streams || []);
      setMovies(data.movie_streams || []);
      setSeries(data.series || []);
      setGroups(['All', ...new Set(data.live_streams.map((ch) => ch.category_name))]);

      const epgRes = await fetch(buildApiUrl('xmltv'));
      const epgText = await epgRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(epgText, 'text/xml');
      const programs = Array.from(doc.querySelectorAll('programme')).map((p) => ({
        channel: p.getAttribute('channel'),
        title: p.querySelector('title')?.textContent,
        start: p.getAttribute('start'),
        stop: p.getAttribute('stop'),
      }));

      setEpg(programs);
      setIsLoggedIn(true);
      setPage('home');
    } catch (e) {
      setLoginError('Failed to connect to server. Please check the address.');
    }
  };

  useEffect(() => {
    if (selectedItem && videoRef.current) {
      const streamType = page === 'live' ? 'live' : page === 'movie' ? 'movie' : 'series';
      const streamUrl = `${serverUrl}/${streamType}/${username}/${password}/${selectedItem.stream_id}.m3u8`;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
      } else {
        videoRef.current.src = streamUrl;
      }
    }
  }, [selectedItem, page]);

  const now = new Date();

  const getChannelEpg = (channel) => {
    return epg
      .filter((p) => p.channel === channel.epg_channel_id)
      .map((p) => {
        const start = new Date(p.start.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
        const stop = new Date(p.stop.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
        return { ...p, start, stop };
      })
      .filter((p) => p.start > new Date(now.getTime() - 2 * 60 * 60 * 1000))
      .sort((a, b) => a.start - b.start);
  };

  const filteredItems = (items) =>
    items.filter((item) =>
      (selectedGroup === 'All' || item.category_name === selectedGroup) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const renderEpgList = (channel) => (
    <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
      {getChannelEpg(channel).map((e, idx) => (
        <li key={idx} className="border-b pb-0.5">
          {e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {e.title}
        </li>
      ))}
    </ul>
  );

  const renderList = (items) => (
    <ul className="space-y-2">
      {filteredItems(items).map((item) => (
        <li
          key={item.stream_id}
          onClick={() => setSelectedItem(item)}
          className="p-2 border rounded hover:bg-blue-100 cursor-pointer"
        >
          <strong>{item.name}</strong>
          {page === 'live' && renderEpgList(item)}
        </li>
      ))}
    </ul>
  );

  if (!isLoggedIn) {
    return (
      <div className="max-w-screen-sm mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🔐 IPTV Login</h1>
        <div className="space-y-3">
          <input className="border p-2 w-full" placeholder="Server URL" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <input className="border p-2 w-full" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
          {loginError && <div className="text-red-600 text-sm mt-2">{loginError}</div>}
        </div>
      </div>
    );
  }

  if (page === 'home') {
    return (
      <div className="max-w-screen-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">🏠 IPTV Home</h1>
        <div className="grid gap-4">
          <button onClick={() => setPage('live')} className="bg-blue-100 border p-4 rounded text-left">📺 Live TV</button>
          <button onClick={() => setPage('movie')} className="bg-green-100 border p-4 rounded text-left">🎬 Movies</button>
          <button onClick={() => setPage('series')} className="bg-yellow-100 border p-4 rounded text-left">📚 Series</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{page === 'live' ? '📺 Live TV' : page === 'movie' ? '🎬 Movies' : '📚 Series'}</h1>
        <button className="text-sm underline" onClick={() => setPage('home')}>⬅ Back to Home</button>
      </div>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {page === 'live' && (
        <>
          <select className="border p-2 mb-4" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          {renderList(channels)}
        </>
      )}

      {page === 'movie' && renderList(movies)}
      {page === 'series' && renderList(series)}

      {selectedItem && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Now Playing: {selectedItem.name}</h2>
          <video ref={videoRef} controls autoPlay className="w-full rounded shadow" />
        </div>
      )}
    </div>
  );
}

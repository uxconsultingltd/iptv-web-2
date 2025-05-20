// IPTV Web Player with Header, Search, Full EPG and Playable Listings

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function App() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('live');
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
    try {
      const res = await fetch(buildApiUrl('player_api'));
      const data = await res.json();
      const live = data.live_streams || [];
      const vod = data.movie_streams || [];
      const ser = data.series || [];

      setChannels(live);
      setMovies(vod);
      setSeries(ser);
      setGroups(['All', ...new Set(live.map((ch) => ch.category_name))]);

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
    } catch (e) {
      alert('Login failed or server error.');
    }
  };

  useEffect(() => {
    if (selectedItem && videoRef.current) {
      const streamType = tab === 'live' ? 'live' : tab === 'movie' ? 'movie' : 'series';
      const streamUrl = `${serverUrl}/${streamType}/${username}/${password}/${selectedItem.stream_id}.m3u8`;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
      } else {
        videoRef.current.src = streamUrl;
      }
    }
  }, [selectedItem, tab]);

  const now = new Date();

  const getChannelEpg = (channel) => {
    return epg
      .filter((p) => p.channel === channel.epg_channel_id)
      .map((p) => {
        const start = new Date(p.start.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
        const stop = new Date(p.stop.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
        return { ...p, start, stop };
      })
      .filter((p) => p.start > new Date(now.getTime() - 2 * 60 * 60 * 1000)) // only recent
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
          {tab === 'live' && renderEpgList(item)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <header className="mb-6 border-b pb-3">
        <h1 className="text-2xl font-bold mb-1">📺 IPTV Web Player</h1>
        <p className="text-sm text-gray-600">Login to access live TV, movies and series</p>
      </header>

      <div className="grid gap-2 mb-4">
        <input className="border p-2" placeholder="Server URL" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
        <input className="border p-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">Login & Load</button>
      </div>

      {selectedItem && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1">Now Playing: {selectedItem.name}</h2>
          <video ref={videoRef} controls autoPlay className="w-full rounded shadow" />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button className={tab === 'live' ? 'font-bold' : ''} onClick={() => setTab('live')}>Live TV</button>
        <button className={tab === 'movie' ? 'font-bold' : ''} onClick={() => setTab('movie')}>Movies</button>
        <button className={tab === 'series' ? 'font-bold' : ''} onClick={() => setTab('series')}>Series</button>
      </div>

      <div className="mb-4">
        <input
          className="border p-2 w-full"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {tab === 'live' && (
        <>
          <select className="border p-2 mb-2" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          {renderList(channels)}
        </>
      )}
      {tab === 'movie' && renderList(movies)}
      {tab === 'series' && renderList(series)}
    </div>
  );
}

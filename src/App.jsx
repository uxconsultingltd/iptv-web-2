// IPTV Web Player – LIVE TV test view with channel groups, list, preview, full screen, and EPG

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function App() {
  const [serverUrl, setServerUrl] = useState('http://line.ottcdn.net:80');
  const [username, setUsername] = useState('cbfa4abc2f');
  const [password, setPassword] = useState('2da068dcfb39');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [epg, setEpg] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
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

      const live = data.live_streams || [];
      setChannels(live);
      setGroups(['All', ...new Set(live.map((ch) => ch.category_name).filter(Boolean))]);

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
    } catch (e) {
      setLoginError('Failed to connect to server.');
    }
  };

  const now = new Date();

  const getEpgForChannel = (channel) => {
    return epg
      .filter((p) => p.channel === channel.epg_channel_id)
      .map((p) => {
        const start = new Date(p.start.slice(0, 12).replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:00'));
        return { ...p, start };
      })
      .sort((a, b) => a.start - b.start);
  };

  const playChannel = (channel) => {
    setSelectedChannel(channel);
    const streamUrl = `${serverUrl}/live/${username}/${password}/${channel.stream_id}.m3u8`;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
    } else {
      videoRef.current.src = streamUrl;
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const filteredChannels = channels.filter(
    (c) => selectedGroup === 'All' || c.category_name === selectedGroup
  );

  if (!isLoggedIn) {
    return (
      <div className="max-w-screen-sm mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">🔐 IPTV Login</h1>
        <div className="space-y-3">
          <input className="border p-2 w-full" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <input className="border p-2 w-full" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="border p-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
          {loginError && <div className="text-red-600 text-sm mt-2">{loginError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-2">📺 Channel Groups</h2>
        <select className="border p-2 w-full mb-4" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
          {groups.map((group, i) => (
            <option key={i} value={group}>{group}</option>
          ))}
        </select>
        <ul className="space-y-1 overflow-y-auto max-h-[70vh]">
          {filteredChannels.map((channel) => (
            <li key={channel.stream_id}>
              <button
                className="text-left w-full p-2 border rounded hover:bg-blue-100"
                onClick={() => playChannel(channel)}
              >
                {channel.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-2">▶️ Preview</h2>
        <div className="border p-2 rounded bg-black">
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full max-h-[360px] rounded cursor-pointer"
            onDoubleClick={toggleFullScreen}
          />
        </div>

        {selectedChannel && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-1">📆 EPG for {selectedChannel.name}</h3>
            <ul className="text-sm space-y-0.5">
              {getEpgForChannel(selectedChannel).map((entry, i) => (
                <li key={i} className="border-b pb-1">
                  {entry.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {entry.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// IPTV Channel Viewer using real data (preview, icons, EPG, full screen)

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

const channels = [
  {
    name: "PL - TVP 1 FHD",
    stream_id: 814363,
    stream_icon: "http://logo.protv.cc/piconsnew/tvp1.png",
    epg_channel_id: "TVP1.pl",
    category_id: "1336"
  },
  {
    name: "PL - TVP 2 FHD",
    stream_id: 814362,
    stream_icon: "http://logo.protv.cc/piconsnew/tvp2.png",
    epg_channel_id: "TVP2.pl",
    category_id: "1336"
  },
  {
    name: "PL - TVN FHD",
    stream_id: 814356,
    stream_icon: "http://logo.protv.cc/piconsnew/tvn.png",
    epg_channel_id: "TVN.pl",
    category_id: "1336"
  }
];

export default function App() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const videoRef = useRef(null);
  const username = "cbfa4abc2f";
  const password = "2da068dcfb39";
  const server = "http://b3.dinott.com";

  const streamUrl = (id) => `${server}/live/${username}/${password}/${id}.m3u8`;

  useEffect(() => {
    if (selectedChannel && videoRef.current) {
      const url = streamUrl(selectedChannel.stream_id);
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
      } else {
        videoRef.current.src = url;
      }
    }
  }, [selectedChannel]);

  const toggleFullScreen = () => {
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">📺 Live TV (Demo)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Kanały</h2>
          <ul className="space-y-2">
            {channels.map((channel) => (
              <li key={channel.stream_id}>
                <button
                  onClick={() => setSelectedChannel(channel)}
                  className="flex items-center gap-2 p-2 border w-full text-left rounded hover:bg-blue-50"
                >
                  <img src={channel.stream_icon} alt="logo" className="w-6 h-6" />
                  <span>{channel.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {selectedChannel ? (
            <div>
              <h2 className="text-xl font-bold mb-2">Preview: {selectedChannel.name}</h2>
              <video
                ref={videoRef}
                controls
                autoPlay
                className="w-full max-h-[360px] rounded bg-black cursor-pointer"
                onDoubleClick={toggleFullScreen}
              />
              <p className="text-sm text-gray-500 mt-2">Double-click video to go full screen</p>
              <p className="text-sm text-gray-700 mt-2">Stream URL: <code>{streamUrl(selectedChannel.stream_id)}</code></p>
              <p className="text-sm text-gray-700 mt-1">EPG ID: <code>{selectedChannel.epg_channel_id}</code></p>
            </div>
          ) : (
            <p className="text-gray-600">Wybierz kanał po lewej, aby rozpocząć oglądanie.</p>
          )}
        </div>
      </div>
    </div>
  );
}

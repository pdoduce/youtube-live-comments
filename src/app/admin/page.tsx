'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [videoId, setVideoId] = useState('')
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('yt-video-id')
    if (saved) setVideoId(saved)
  }, [])

  const handleSave = () => {
    if (!videoId) return
    localStorage.setItem('yt-video-id', videoId)
    alert('Video ID saved successfully!')
    router.push('/live')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center text-pink-400">Admin: Set YouTube Live Video ID</h1>
        <input
          type="text"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter YouTube Live Video ID"
        />
        <button
          onClick={handleSave}
          className="w-full bg-pink-500 hover:bg-pink-600 transition rounded p-3 font-semibold"
        >
          Save & View Comments
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

type Comment = {
  id: string
  name: string
  photo: string
  message: string
}

const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY!
const scrollSpeed = parseInt(process.env.NEXT_PUBLIC_SCROLL_SPEED_MS || '30000') // default 30s

export default function LivePage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [videoId, setVideoId] = useState<string | null>(null)
  const [liveChatId, setLiveChatId] = useState<string | null>(null)
  const [scrollKey, setScrollKey] = useState<number>(0) // used to reset animation
  const lastFetchedIdsRef = useRef<Set<string>>(new Set())

  // Load videoId from localStorage or fallback
  useEffect(() => {
    const id = localStorage.getItem('yt-video-id') || process.env.NEXT_PUBLIC_YT_VIDEO_ID!
    setVideoId(id)
  }, [])

  // Fetch liveChatId when videoId is available
  useEffect(() => {
    if (!videoId) return

    const fetchLiveChatId = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`
        )
        const data = await res.json()
        const chatId = data?.items?.[0]?.liveStreamingDetails?.activeLiveChatId
        setLiveChatId(chatId)
      } catch (err) {
        console.error('Failed to get liveChatId:', err)
      }
    }

    fetchLiveChatId()
  }, [videoId])

  // Poll for comments every 5 seconds
  useEffect(() => {
    if (!liveChatId) return
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${apiKey}`
        )
        const data = await res.json()
        const newComments = data.items.map((item: any) => ({
          id: item.id,
          name: item.authorDetails.displayName,
          photo: item.authorDetails.profileImageUrl,
          message: item.snippet.displayMessage,
        }))

        const unique = newComments.filter(n => !lastFetchedIdsRef.current.has(n.id))

        if (unique.length > 0) {
          unique.forEach(c => lastFetchedIdsRef.current.add(c.id))
          setComments(prev => {
            const merged = [...prev.slice(-50), ...unique]
            return merged
          })
          setScrollKey(prev => prev + 1) // force reset animation
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    const interval = setInterval(fetchMessages, 5000)
    fetchMessages() // initial call
    return () => clearInterval(interval)
  }, [liveChatId])

  if (!videoId) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-xl">
        No video ID found. Please go to <code className="mx-2 px-2 py-1 bg-gray-800 rounded">/admin</code> to set one.
      </div>
    )
  }

  // Double the comment list to prevent scroll gap
  const duplicatedComments = [...comments, ...comments]

  return (
    <div className="w-full h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden flex items-center justify-center p-4">
      <div className="w-[1280px] h-full overflow-hidden relative">
        <div
          key={scrollKey} // resets animation when updated
          className="absolute w-full"
          style={{
            animation: `scrollUp ${scrollSpeed}ms linear infinite`,
          }}
        >
          <div className="space-y-4 px-4 py-10">
            {duplicatedComments.map(comment => (
              <div
                key={`${comment.id}-${Math.random()}`} // ensure unique keys across duplicates
                className="flex items-start space-x-4 p-4 bg-white/10 rounded-lg shadow-md"
              >
                <Image
                  src={comment.photo}
                  alt={comment.name}
                  width={50}
                  height={50}
                  className="rounded-full border-2 border-white"
                />
                <div>
                  <div className="font-bold text-pink-400 text-2xl">{comment.name.toUpperCase()}</div>
                  <div className="text-white text-lg">{comment.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes scrollUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  )
}

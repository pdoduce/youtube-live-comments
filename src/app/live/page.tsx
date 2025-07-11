'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Comment = {
  id: string
  name: string
  photo: string
  message: string
}

const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY!
const scrollSpeed = parseInt(process.env.NEXT_PUBLIC_SCROLL_SPEED_MS || '30000') // Default to 30s

export default function LivePage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [videoId, setVideoId] = useState<string | null>(null)
  const [liveChatId, setLiveChatId] = useState<string | null>(null)
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
        const newComments: Comment[] = data.items.map((item: any): Comment => ({
          id: item.id,
          name: item.authorDetails.displayName,
          photo: item.authorDetails.profileImageUrl,
          message: item.snippet.displayMessage,
        }))

        const unique = newComments.filter((n: Comment) => !lastFetchedIdsRef.current.has(n.id))

        if (unique.length > 0) {
          unique.forEach((c: Comment) => lastFetchedIdsRef.current.add(c.id))
          setComments((prev) => [...prev.slice(-50), ...unique])
        } else if (comments.length > 0) {
          // If no new comments, repeat previous comments
          setComments((prev) => [...prev])
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    const interval = setInterval(fetchMessages, 5000)
    fetchMessages() // initial call
    return () => clearInterval(interval)
  }, [liveChatId, comments])

  if (!videoId) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-xl">
        No video ID found. Please go to <code className="mx-2 px-2 py-1 bg-gray-800 rounded">/admin</code> to set one.
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden flex items-center justify-center p-4">
      <div className="w-[1280px] h-full overflow-hidden relative">
        <div
          className="absolute w-full"
          style={{
            animation: `scrollUp ${scrollSpeed}ms linear infinite`,
          }}
        >
          <div className="space-y-4 px-4 py-10">
            {comments.map((comment: Comment) => (
              <div
                key={comment.id}
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
            transform: translateY(100%);
          }
          100% {
            transform: translateY(-100%);
          }
        }
      `}</style>
    </div>
  )
}

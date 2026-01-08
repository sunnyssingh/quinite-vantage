'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause, Download, Volume2, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CallRecordingPlayer({ callLogId }) {
    const [recording, setRecording] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [playing, setPlaying] = useState(false)
    const [audio, setAudio] = useState(null)

    async function loadRecording() {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/call-logs/${callLogId}/recording`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load recording')
            }

            setRecording(data.callLog)

            // Create audio element
            const audioElement = new Audio(data.callLog.recordingUrl)
            audioElement.addEventListener('ended', () => setPlaying(false))
            setAudio(audioElement)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function togglePlay() {
        if (!audio) return

        if (playing) {
            audio.pause()
            setPlaying(false)
        } else {
            audio.play()
            setPlaying(true)
        }
    }

    function downloadRecording() {
        if (!recording?.recordingUrl) return

        const link = document.createElement('a')
        link.href = recording.recordingUrl
        link.download = `call-recording-${recording.callSid}.${recording.recordingFormat || 'mp3'}`
        link.click()
    }

    if (!recording && !loading && !error) {
        return (
            <Button onClick={loadRecording} variant="outline" size="sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Load Recording
            </Button>
        )
    }

    if (loading) {
        return <div className="text-sm text-gray-500">Loading recording...</div>
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (!recording) return null

    return (
        <Card className="mt-4">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Recording Info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Call Recording</h4>
                            <p className="text-sm text-gray-500">
                                Duration: {Math.floor(recording.recordingDuration / 60)}:
                                {String(recording.recordingDuration % 60).padStart(2, '0')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={togglePlay} size="sm">
                                {playing ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Play
                                    </>
                                )}
                            </Button>
                            <Button onClick={downloadRecording} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>

                    {/* Transcript */}
                    {recording.transcript && (
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <h5 className="font-medium text-sm">Transcript</h5>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-64 overflow-y-auto">
                                {recording.transcript}
                            </div>
                        </div>
                    )}

                    {/* Lead Info */}
                    <div className="border-t pt-4 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-gray-500">Lead:</span>{' '}
                                <span className="font-medium">{recording.lead?.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>{' '}
                                <span className="font-medium capitalize">{recording.status}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Transferred:</span>{' '}
                                <span className="font-medium">{recording.transferred ? 'Yes' : 'No'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Date:</span>{' '}
                                <span className="font-medium">
                                    {new Date(recording.callTimestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

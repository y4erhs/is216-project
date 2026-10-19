// stable key for a session: its start time in milliseconds
export const sessionKey = (s) => new Date(s.startTime).getTime()

export function formatSession(session) {
    const start = new Date(session.startTime)
    const end = new Date(session.endTime)
    const day = start.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })
    const time = (d) => d.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })
    return `${day} · ${time(start)}–${time(end)}`
}
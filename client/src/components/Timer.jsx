import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Timer = ({ onTimerStart, onTimerStop, activeTimer }) => {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (activeTimer) {
            setIsRunning(true);
            const startTime = new Date(activeTimer.startTime);

            const interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now - startTime) / 1000);
                setElapsed(diff);
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setIsRunning(false);
            setElapsed(0);
        }
    }, [activeTimer]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleStop = async () => {
        if (activeTimer) {
            await onTimerStop(activeTimer.id);
        }
    };

    if (!isRunning) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: '#6366f1',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
            minWidth: '300px',
            zIndex: 1000
        }}>
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                    Active Timer
                </div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                    {activeTimer?.description || 'Untitled Task'}
                </div>
                {activeTimer?.client && (
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
                        {activeTimer.client.name}
                    </div>
                )}
            </div>

            <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textAlign: 'center',
                marginBottom: '1rem',
                letterSpacing: '0.05em'
            }}>
                {formatTime(elapsed)}
            </div>

            <button
                onClick={handleStop}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    color: '#6366f1',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}
            >
                Stop Timer
            </button>

            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem', textAlign: 'center' }}>
                Started {formatDistanceToNow(new Date(activeTimer?.startTime), { addSuffix: true })}
            </div>
        </div>
    );
};

export default Timer;

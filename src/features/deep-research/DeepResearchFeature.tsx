import React, { useState, useEffect, useRef } from 'react';
import { DeepResearch, Terminal } from '../../components/icons/index';
import { Button } from '../../components/ui';

type StatusLog = {
    message: string;
    type: 'status' | 'error' | 'info';
};

const DeepResearchFeature: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
    const [terminalOutput, setTerminalOutput] = useState<string>('');
    const [command, setCommand] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom of terminal on new output
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);
    
    // Cleanup WebSocket connection on component unmount
    useEffect(() => {
        return () => {
            ws.current?.close();
        }
    }, []);

    const addLog = (message: string, type: StatusLog['type'] = 'status') => {
        setStatusLogs(prev => [...prev, { message, type }]);
    };

    const handleStartSession = () => {
        addLog('Starting new research session...', 'info');
        
        // Connect to WebSocket server
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/interactive-ws`;
        
        // Ensure old connection is closed before opening a new one
        if (ws.current) {
            ws.current.close();
        }

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            addLog('WebSocket connection established.', 'info');
            ws.current?.send(JSON.stringify({ command: 'start-session' }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'status':
                    addLog(data.message);
                    break;
                case 'droplet_created':
                    addLog(data.message, 'info');
                    break;
                case 'ssh_connected':
                    addLog(data.message, 'info');
                    setIsSessionActive(true);
                    break;
                case 'terminal':
                    setTerminalOutput(prev => prev + data.data);
                    break;
                case 'error':
                    addLog(data.message, 'error');
                    break;
            }
        };

        ws.current.onclose = () => {
            addLog('Session terminated.', 'error');
            setIsSessionActive(false);
            ws.current = null;
        };
        
        ws.current.onerror = (err) => {
            console.error("WebSocket error:", err);
            addLog('Connection error occurred.', 'error');
        };
    };

    const handleSendCommand = (e: React.FormEvent) => {
        e.preventDefault();
        if (command.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ command: 'run-command', payload: command }));
            setTerminalOutput(prev => prev + command + '\n');
            setCommand('');
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Panel: Status & Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6 h-[70vh] flex flex-col">
                <div className="flex items-center space-x-3">
                    <DeepResearch className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold text-slate-800">AI Research Assistant</h2>
                </div>
                <p className="text-sm text-slate-600">
                    Start a session to create a secure, sandboxed environment for the AI to perform research.
                </p>

                <Button onClick={handleStartSession} disabled={isSessionActive || !!ws.current} className="w-full">
                    {isSessionActive ? 'Session Active' : (ws.current ? 'Connecting...' : 'Start New Session')}
                </Button>
                
                <div className="flex-grow border-t border-slate-200 mt-6 pt-6 overflow-y-auto">
                    <h3 className="font-semibold text-slate-700 mb-2">Session Logs</h3>
                    <ul className="space-y-1.5 text-sm">
                        {statusLogs.map((log, index) => (
                            <li key={index} className={`flex items-start ${log.type === 'error' ? 'text-red-500' : 'text-slate-600'}`}>
                                <span className="mr-2">&rarr;</span>
                                <span>{log.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Panel: Terminal */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl shadow-sm border border-slate-700 h-[70vh] flex flex-col font-mono text-sm">
                <div className="flex items-center space-x-2 border-b border-slate-600 pb-2 mb-2 flex-shrink-0">
                    <Terminal className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-slate-300">Interactive Terminal</h3>
                </div>
                
                {isSessionActive ? (
                    <>
                        <div className="flex-grow overflow-y-auto text-white whitespace-pre-wrap">
                            {terminalOutput}
                            <div ref={terminalEndRef} />
                        </div>
                        <form onSubmit={handleSendCommand} className="flex items-center mt-2 flex-shrink-0">
                            <span className="text-green-400">root@elice-research-env:~#&nbsp;</span>
                            <input
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                className="flex-grow bg-transparent text-white focus:outline-none ml-2"
                                autoFocus
                                onFocus={e => e.currentTarget.scrollIntoView()}
                            />
                        </form>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400">
                        <Terminal className="w-16 h-16 text-slate-500 mb-4" />
                        <p className="max-w-xs">
                            Start a session to activate the terminal.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeepResearchFeature;

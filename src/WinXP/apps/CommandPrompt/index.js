import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const TerminalContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  padding: 10px;
  box-sizing: border-box;
`;

const CommandPrompt = ({ onClose, onMinimize, isFocus }) => {
  const terminalRef = useRef(null);
  const [pyodide, setPyodide] = useState(null);
  const [inputBuffer, setInputBuffer] = useState('');
  const [term, setTerm] = useState(null);

  useEffect(() => {
    const terminal = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
      },
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminal.writeln('Microsoft Windows XP [Version 5.1.2600]');
    terminal.writeln('(C) Copyright 1985-2001 Microsoft Corp.');
    terminal.writeln('');
    terminal.write('C:\\> ');

    setTerm(terminal);

    // Load Pyodide
    const loadPyodideScript = async () => {
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = async () => {
          const pyodideInstance = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });
          setPyodide(pyodideInstance);
          terminal.writeln('Python environment loaded.');
        };
        document.head.appendChild(script);
      }
    };

    loadPyodideScript();

    // Handle input
    let currentLine = '';

    terminal.onData((data) => {
      if (data === '\r' || data === '\n') {
        // Enter pressed
        terminal.writeln('');
        handleCommand(currentLine.trim());
        currentLine = '';
        terminal.write('C:\\> ');
      } else if (data === '\x7f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else {
        currentLine += data;
        terminal.write(data);
      }
    });

    const handleCommand = async (command) => {
      if (!command) return;

      if (command.toLowerCase().startsWith('python ') || command.includes('print') || command.includes('def ') || command.includes('import ')) {
        // Treat as Python code
        if (pyodide) {
          try {
            const result = await pyodide.runPythonAsync(command);
            if (result !== undefined) {
              terminal.writeln(result.toString());
            }
          } catch (error) {
            terminal.writeln(`Error: ${error.message}`);
          }
        } else {
          terminal.writeln('Python environment not loaded yet.');
        }
      } else {
        // Simulate basic CMD commands
        switch (command.toLowerCase()) {
          case 'help':
            terminal.writeln('Available commands:');
            terminal.writeln('help - Show this help');
            terminal.writeln('cls - Clear screen');
            terminal.writeln('dir - List directory');
            terminal.writeln('echo <text> - Display text');
            terminal.writeln('Or type Python code directly');
            break;
          case 'cls':
            terminal.clear();
            break;
          case 'dir':
            terminal.writeln(' Volume in drive C has no label.');
            terminal.writeln(' Volume Serial Number is 1234-5678');
            terminal.writeln('');
            terminal.writeln(' Directory of C:\\');
            terminal.writeln('');
            terminal.writeln('01/01/2001  12:00 AM    <DIR>          .');
            terminal.writeln('01/01/2001  12:00 AM    <DIR>          ..');
            terminal.writeln('01/01/2001  12:00 AM                 0 file.txt');
            terminal.writeln('               1 File(s)              0 bytes');
            terminal.writeln('               2 Dir(s)   1,000,000,000 bytes free');
            break;
          default:
            if (command.startsWith('echo ')) {
              terminal.writeln(command.slice(5));
            } else {
              terminal.writeln(`'${command}' is not recognized as an internal or external command,`);
              terminal.writeln('operable program or batch file.');
            }
            break;
        }
      }
    };

    return () => {
      terminal.dispose();
    };
  }, [pyodide]);

  useEffect(() => {
    if (term) {
      const handleResize = () => {
        const fitAddon = term.loadAddon(new FitAddon());
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [term]);

  return (
    <TerminalContainer ref={terminalRef} />
  );
};

export default CommandPrompt;
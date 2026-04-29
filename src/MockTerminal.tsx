import { useCallback, useRef } from 'react'
import { Terminal, type TerminalHandle } from '@wterm/react'

const PROMPT = '\x1b[36mamika\x1b[0m@\x1b[32mdemo-sandbox\x1b[0m:~$ '
const BANNER = [
  'amika mock-shell v0.1 — type `help` for available commands.',
  'This shell is simulated entirely in the browser; no backend is involved.',
  ''
]

const MOCK_FILES: Record<string, string> = {
  'README.md': 'Mock sandbox README. See https://wterm.dev for the terminal emulator.',
  'deploy.json':
    JSON.stringify({ workflow: 'build-and-verify', commit: '3b42aef', target: 'us-east-1' }, null, 2),
  'notes.txt': 'Sandbox notes:\n- factory.events.deploy is the canonical topic.\n- ttl defaults to 30m.'
}

function runCommand(input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const [cmd, ...args] = trimmed.split(/\s+/)
  switch (cmd) {
    case 'help':
      return [
        'Available commands:',
        '  help              show this message',
        '  echo <text>       print <text>',
        '  ls                list mock files',
        '  cat <file>        print the contents of a mock file',
        '  whoami            print the current user',
        '  pwd               print the working directory',
        '  date              print the current date/time',
        '  clear             clear the screen'
      ]
    case 'echo':
      return [args.join(' ')]
    case 'ls':
      return [Object.keys(MOCK_FILES).join('  ')]
    case 'cat': {
      const name = args[0]
      if (!name) return ['cat: missing file operand']
      const body = MOCK_FILES[name]
      if (body === undefined) return [`cat: ${name}: No such file or directory`]
      return body.split('\n')
    }
    case 'whoami':
      return ['amika']
    case 'pwd':
      return ['/workspaces/release-2026']
    case 'date':
      return [new Date().toString()]
    case 'clear':
      return ['__CLEAR__']
    default:
      return [`${cmd}: command not found`]
  }
}

export default function MockTerminal() {
  const ref = useRef<TerminalHandle>(null)
  const bufferRef = useRef('')

  const write = useCallback((data: string) => {
    ref.current?.write(data)
  }, [])

  const writeLine = useCallback(
    (line: string) => {
      write(line + '\r\n')
    },
    [write]
  )

  const writePrompt = useCallback(() => {
    write(PROMPT)
  }, [write])

  const handleReady = useCallback(() => {
    for (const line of BANNER) writeLine(line)
    writePrompt()
    ref.current?.focus()
  }, [writeLine, writePrompt])

  const handleData = useCallback(
    (data: string) => {
      for (const ch of data) {
        if (ch === '\r' || ch === '\n') {
          write('\r\n')
          const cmd = bufferRef.current
          bufferRef.current = ''
          const output = runCommand(cmd)
          if (output[0] === '__CLEAR__') {
            write('\x1b[2J\x1b[H')
          } else {
            for (const line of output) writeLine(line)
          }
          writePrompt()
        } else if (ch === '\x7f' || ch === '\b') {
          if (bufferRef.current.length > 0) {
            bufferRef.current = bufferRef.current.slice(0, -1)
            write('\b \b')
          }
        } else if (ch === '\x03') {
          write('^C\r\n')
          bufferRef.current = ''
          writePrompt()
        } else if (ch >= ' ' && ch <= '~') {
          bufferRef.current += ch
          write(ch)
        }
      }
    },
    [write, writeLine, writePrompt]
  )

  return (
    <Terminal
      ref={ref}
      theme="monokai"
      cursorBlink
      autoResize
      onData={handleData}
      onReady={handleReady}
    />
  )
}

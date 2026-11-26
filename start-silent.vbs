Set shell = CreateObject("WScript.Shell")
projectDir = "D:\Projects\silicon-note"
cmd = "cmd /c cd /d """ & projectDir & """ && "".\node_modules\.bin\vite.cmd"" preview --port 5173 --host 127.0.0.1"
shell.Run cmd, 0, False

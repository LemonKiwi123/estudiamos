' Runs "Start Estudiamos.cmd" without showing a black console window.
' With /server it only starts the sync server in the background (used when signing in to Windows).
Set sh = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Run from your home folder, not from inside the Estudiamos folder: Windows won't let you move a folder a program is running in.
sh.CurrentDirectory = sh.ExpandEnvironmentStrings("%USERPROFILE%")
If WScript.Arguments.Count > 0 Then
  If LCase(WScript.Arguments(0)) = "/server" Then
    sh.Run "node """ & folder & "\server.js""", 0, False
    WScript.Quit
  End If
End If
sh.Run "cmd /c """ & folder & "\Start Estudiamos.cmd""", 0, False

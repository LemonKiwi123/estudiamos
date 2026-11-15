// Estudiamos launcher for the Microsoft Store package (built by make-msix.js with the .NET Framework compiler, no console window).
// 1. Starts the bundled Node.js running the sync server (hidden), unless it is already running.
// 2. Opens the app in a Microsoft Edge app window (or the default browser if Edge can't be found).
// "Estudiamos.exe /server" only starts the server (used when Windows starts).
// Your data lives in Documents\Estudiamos\EstudiarData: the same place the regular download keeps it, so both versions share it.
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

static class Launcher {
  // ESTUDIAR_PORT and ESTUDIAR_DATA can be set for testing; normally they are not
  static readonly int Port = EnvPort();
  static int EnvPort() { int p; return int.TryParse(Environment.GetEnvironmentVariable("ESTUDIAR_PORT"), out p) ? p : 5178; }
  static readonly string Url = "http://localhost:" + Port + "/";

  static bool ServerUp() {
    try {
      var req = (HttpWebRequest)WebRequest.Create(Url + "api/info");
      req.Timeout = 800; req.Proxy = null;
      using (var res = (HttpWebResponse)req.GetResponse()) return res.StatusCode == HttpStatusCode.OK;
    } catch { return false; }
  }

  [STAThread]
  static void Main(string[] args) {
    string root = AppDomain.CurrentDomain.BaseDirectory;
    string node = Path.Combine(root, "node", "node.exe"), server = Path.Combine(root, "app", "server.js");
    string data = Environment.GetEnvironmentVariable("ESTUDIAR_DATA");
    if (string.IsNullOrEmpty(data)) data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Estudiamos", "EstudiarData");
    bool serverOnly = args.Length > 0 && args[0].Trim().ToLowerInvariant() == "/server";
    try {
      Directory.CreateDirectory(data);
      if (!ServerUp()) {
        var psi = new ProcessStartInfo(node, "\"" + server + "\"") {
          UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden,
          WorkingDirectory = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)
        };
        psi.EnvironmentVariables["ESTUDIAR_DATA"] = data;
        psi.EnvironmentVariables["ESTUDIAR_STORE"] = "1";
        psi.EnvironmentVariables["ESTUDIAR_PORT"] = Port.ToString();
        Process.Start(psi);
        for (int i = 0; i < 40 && !ServerUp(); i++) Thread.Sleep(250);
      }
      if (serverOnly) return;
      if (!ServerUp()) { MessageBox.Show("Estudiamos couldn't start. Please try again, or restart your PC.", "Estudiamos", MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
      try { Process.Start(new ProcessStartInfo("msedge", "--app=" + Url) { UseShellExecute = true }); }
      catch { Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true }); }
    } catch (Exception e) {
      MessageBox.Show("Estudiamos couldn't start:\n" + e.Message, "Estudiamos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
    }
  }
}

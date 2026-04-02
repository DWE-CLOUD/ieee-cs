import { useState, useEffect } from "react";
import { Download, Smartphone, Check, ArrowLeft, Share, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-4">
            App Installed!
          </h1>
          <p className="text-muted-foreground mb-8">
            IEEE Computer Society is now installed on your device. You can access it from your home screen.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IEEE</span>
            </div>
            <span className="font-serif text-lg text-foreground">Computer Society</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-foreground rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-elegant">
            <Smartphone className="w-12 h-12 text-primary-foreground" />
          </div>

          <h1 className="font-serif text-4xl text-foreground mb-4">
            Install Our App
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get quick access to IEEE Computer Society right from your home screen. 
            No app store needed — it works offline and loads instantly.
          </p>

          {/* Install Button or iOS Instructions */}
          {isIOS ? (
            <div className="bg-card rounded-2xl p-6 border border-border/50 text-left mb-8">
              <h3 className="font-medium text-foreground mb-4 text-center">
                How to Install on iPhone/iPad
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Tap the <Share className="w-4 h-4 inline text-accent" /> Share button in Safari
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Scroll down and tap "Add to Home Screen"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Tap "Add" to install
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="group w-full flex items-center justify-center gap-3 bg-foreground text-primary-foreground px-8 py-4 rounded-full text-base font-medium hover:bg-foreground/90 transition-all shadow-elegant mb-8"
            >
              <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
              Install App
            </button>
          ) : (
            <div className="bg-card rounded-2xl p-6 border border-border/50 text-left mb-8">
              <h3 className="font-medium text-foreground mb-4 text-center">
                How to Install on Android
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Tap the <MoreVertical className="w-4 h-4 inline text-accent" /> menu in Chrome
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Tap "Install app" or "Add to Home screen"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-foreground text-primary-foreground text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-sm text-foreground">
                      Tap "Install" to confirm
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Works Offline</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Download className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">No App Store</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Fast & Light</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
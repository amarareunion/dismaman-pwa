// BackendKeepAlive.ts - Version PWA simplifiée
class BackendKeepAlive {
  static async warmupBackend(url: string): Promise<void> {
    try {
      console.log('🔥 Warming up backend...');
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Backend warmed up successfully');
      } else {
        console.warn('⚠️ Backend warmup returned:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Backend warmup failed:', error);
    }
  }

  static startKeepAlive(url: string, intervalMs: number = 300000): void {
    // Ping toutes les 5 minutes pour garder le backend actif
    setInterval(() => {
      this.warmupBackend(url);
    }, intervalMs);
  }
}

export default BackendKeepAlive;

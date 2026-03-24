class HealthService {
  /**
   * Helper function to simulate a latency check.
   */
  private async simulateCheck(serviceName: string, baseLatency: number): Promise<{ status: string; latency: number; lastChecked: string }> {
    const latency = baseLatency + Math.floor(Math.random() * 20);
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, latency));

    // Simulate occasional unhealthy for Twitter
    if (serviceName === 'twitter' && Math.random() < 0.2) {
        return {
          status: 'unhealthy',
          latency: latency,
          lastChecked: new Date().toISOString(),
        };
    }

    return {
      status: 'healthy',
      latency,
      lastChecked: new Date().toISOString(),
    };
  }

  public async checkDatabase() {
    return this.simulateCheck('database', 10);
  }

  public async checkRedis() {
    return this.simulateCheck('redis', 5);
  }

  public async checkS3() {
    return this.simulateCheck('s3', 15);
  }

  public async checkTwitterAPI() {
    return this.simulateCheck('twitter', 50);
  }

  public async getSystemStatus() {
    const [database, redis, s3, twitter] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
      this.checkTwitterAPI(),
    ]);

    const dependencies = { database, redis, s3, twitter };
    
    const isUnhealthy = Object.values(dependencies).some((dep) => dep.status !== 'healthy');
    const overallStatus = isUnhealthy ? 'unhealthy' : 'healthy';

    return {
      dependencies,
      overallStatus
    };
  }
}

export const healthService = new HealthService();

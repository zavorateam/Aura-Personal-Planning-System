import { Octokit } from 'octokit';
import { AppState, Task, Lesson, Attendance, Note, Project, Goal, Insight } from '../types';
import { SecurityService } from './security';

export class GitHubSyncService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, user: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = user;
    this.repo = repo;
  }

  private async uploadFile(path: string, content: string, message: string): Promise<void> {
    const performUpload = async (currentSha?: string) => {
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: btoa(content),
        sha: currentSha,
      });
    };

    let sha: string | undefined;
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        headers: { 'If-None-Match': '' } // Bypass some caching
      });
      if (!Array.isArray(data)) {
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist
    }

    try {
      await performUpload(sha);
    } catch (error: any) {
      if (error.status === 409) {
        // SHA mismatch, fetch latest SHA and retry once
        try {
          const { data } = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path,
            headers: { 'If-None-Match': '' }
          });
          if (!Array.isArray(data)) {
            await performUpload(data.sha);
            return;
          }
        } catch (retryError) {
          console.error('Retry upload failed:', retryError);
        }
      }
      throw error;
    }
  }

  private async downloadFile(path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });
      if (!Array.isArray(data) && 'content' in data) {
        return atob(data.content.replace(/\n/g, ''));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async pushState(state: AppState, encryptionKey: CryptoKey): Promise<void> {
    const timestamp = new Date().toISOString();
    const index: string[] = [];

    const pushEntity = async (entity: any, folder: string) => {
      const encrypted = await SecurityService.encrypt(JSON.stringify(entity), encryptionKey);
      const path = `data/${folder}/${entity.id}.enc`;
      await this.uploadFile(path, encrypted, `Update ${folder}/${entity.id}`);
      index.push(path);
    };

    // Push all entities
    await Promise.all([
      ...state.tasks.map(t => pushEntity(t, 'tasks')),
      ...state.lessons.map(l => pushEntity(l, 'lessons')),
      ...state.attendance.map(a => pushEntity(a, 'attendance')),
      ...state.notes.map(n => pushEntity(n, 'notes')),
      ...state.projects.map(p => pushEntity(p, 'projects')),
      ...state.goals.map(g => pushEntity(g, 'goals')),
      ...state.habits.map(h => pushEntity(h, 'habits')),
      ...state.insights.map(i => pushEntity(i, 'insights')),
    ]);

    // Push meta
    const indexEncrypted = await SecurityService.encrypt(JSON.stringify(index), encryptionKey);
    await this.uploadFile('meta/index.enc', indexEncrypted, 'Update index');

    const settingsToSync = { ...state.settings };
    delete settingsToSync.githubToken; // Don't sync token
    const settingsEncrypted = await SecurityService.encrypt(JSON.stringify(settingsToSync), encryptionKey);
    await this.uploadFile('meta/settings.enc', settingsEncrypted, 'Update settings');

    // Push sync state
    const lastSyncEncrypted = await SecurityService.encrypt(timestamp, encryptionKey);
    await this.uploadFile('sync/last-sync.enc', lastSyncEncrypted, 'Update last sync');
  }

  async pullState(encryptionKey: CryptoKey): Promise<Partial<AppState> | null> {
    const indexEncrypted = await this.downloadFile('meta/index.enc');
    if (!indexEncrypted) return null;

    const indexJson = await SecurityService.decrypt(indexEncrypted, encryptionKey);
    const index: string[] = JSON.parse(indexJson);

    const newState: Partial<AppState> = {
      tasks: [],
      lessons: [],
      attendance: [],
      notes: [],
      projects: [],
      goals: [],
      habits: [],
      insights: [],
    };

    await Promise.all(index.map(async (path) => {
      const encrypted = await this.downloadFile(path);
      if (encrypted) {
        const decrypted = await SecurityService.decrypt(encrypted, encryptionKey);
        const entity = JSON.parse(decrypted);
        
        if (path.startsWith('data/tasks/')) newState.tasks?.push(entity);
        else if (path.startsWith('data/lessons/')) newState.lessons?.push(entity);
        else if (path.startsWith('data/attendance/')) newState.attendance?.push(entity);
        else if (path.startsWith('data/notes/')) newState.notes?.push(entity);
        else if (path.startsWith('data/projects/')) newState.projects?.push(entity);
        else if (path.startsWith('data/goals/')) newState.goals?.push(entity);
        else if (path.startsWith('data/habits/')) newState.habits?.push(entity);
        else if (path.startsWith('data/insights/')) newState.insights?.push(entity);
      }
    }));

    const settingsEncrypted = await this.downloadFile('meta/settings.enc');
    if (settingsEncrypted) {
      const settingsJson = await SecurityService.decrypt(settingsEncrypted, encryptionKey);
      newState.settings = JSON.parse(settingsJson);
    }

    return newState;
  }
}

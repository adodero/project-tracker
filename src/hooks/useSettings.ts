import { useState, useCallback } from "react";
import { DEFAULT_TEAM_MEMBERS, DEFAULT_PROJECTS } from "@/types/kanban";

const TEAM_KEY = "kanban-team-members";
const PROJECTS_KEY = "kanban-projects";

const load = (key: string, defaults: string[]): string[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaults;
};

export const useSettings = () => {
  const [teamMembers, setTeamMembers] = useState<string[]>(() => load(TEAM_KEY, DEFAULT_TEAM_MEMBERS));
  const [projects, setProjects] = useState<string[]>(() => load(PROJECTS_KEY, DEFAULT_PROJECTS));

  const updateTeamMembers = useCallback((members: string[]) => {
    setTeamMembers(members);
    localStorage.setItem(TEAM_KEY, JSON.stringify(members));
  }, []);

  const updateProjects = useCallback((projs: string[]) => {
    setProjects(projs);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projs));
  }, []);

  return { teamMembers, projects, updateTeamMembers, updateProjects };
};

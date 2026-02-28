import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, X, Users, FolderOpen } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: string[];
  projects: string[];
  onUpdateTeamMembers: (members: string[]) => void;
  onUpdateProjects: (projects: string[]) => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  teamMembers,
  projects,
  onUpdateTeamMembers,
  onUpdateProjects,
}: SettingsDialogProps) => {
  const [newMember, setNewMember] = useState("");
  const [newProject, setNewProject] = useState("");

  const addMember = () => {
    const name = newMember.trim();
    if (name && !teamMembers.includes(name)) {
      onUpdateTeamMembers([...teamMembers, name]);
      setNewMember("");
    }
  };

  const removeMember = (name: string) => {
    onUpdateTeamMembers(teamMembers.filter((m) => m !== name));
  };

  const addProject = () => {
    const name = newProject.trim();
    if (name && !projects.includes(name)) {
      onUpdateProjects([...projects, name]);
      setNewProject("");
    }
  };

  const removeProject = (name: string) => {
    onUpdateProjects(projects.filter((p) => p !== name));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Team Members */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> Team Members
            </label>
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium"
                >
                  {name}
                  <button
                    onClick={() => removeMember(name)}
                    className="p-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
                placeholder="Add team member..."
                className="text-xs h-9"
              />
              <button
                onClick={addMember}
                className="p-2 h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5" /> Projects
            </label>
            <div className="flex flex-wrap gap-1.5">
              {projects.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium"
                >
                  {name}
                  <button
                    onClick={() => removeProject(name)}
                    className="p-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProject()}
                placeholder="Add project..."
                className="text-xs h-9"
              />
              <button
                onClick={addProject}
                className="p-2 h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

# Tasker — Kanban Task Board

A beautiful, fully-featured Kanban-style task board built with React and Supabase.

## Live Demo
https://kanban-board-eta-gold.vercel.app/

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Anonymous Auth)
- **Drag and Drop:** @dnd-kit
- **Icons:** Lucide React
- **Hosting:** Vercel

## Features
- Kanban board with 4 columns (To Do, In Progress, In Review, Done)
- Drag and drop tasks between columns
- Guest authentication (anonymous sign-in via Supabase)
- Row Level Security — each user only sees their own data
- Create, edit, and delete tasks
- Task comments with timestamps
- Task activity log (tracks status changes and edits)
- Labels/Tags with color coding and filtering
- Team members and assignees with avatar display
- Due date indicators (overdue and due soon highlighting)
- Search tasks by title
- Filter by label and assignee
- Board summary stats (total, completed, completion rate, overdue)
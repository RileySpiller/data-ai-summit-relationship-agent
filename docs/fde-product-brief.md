# FDE Product Brief

## Product Thesis

Conference relationship management is a messy workflow with real business value.

People leave events with names, fragments, company signals, weak ties, hiring conversations, and half-remembered context. The gap is not note-taking. The gap is turning the notes into useful next action before the signal goes cold.

## User

Primary user:

```text
An applied AI builder or forward-deployed engineer at a high-signal industry event.
```

Secondary users:

- founders doing customer discovery
- recruiters tracking candidate and hiring-manager conversations
- solutions engineers mapping stakeholder networks
- sales engineers working technical conferences
- operators managing warm follow-up loops

## Workflow

```text
messy note -> signal extraction -> priority score -> pipeline stage -> follow-up draft -> company-fit brief
```

## Current Implementation

The current prototype uses deterministic heuristics instead of calling a model. That is deliberate for the first version:

- runs instantly
- works offline
- is easy to inspect
- keeps the scoring model explainable
- can later be upgraded with an LLM extraction layer

## What A Model Would Add

An LLM layer could improve:

- entity extraction
- inferred intent
- role normalization
- follow-up tone
- next-step recommendations
- company-specific research enrichment
- risk detection for weak or vague notes

## Why It Matters For FDE Roles

This is a compact proof of the core FDE loop:

- understand a real workflow
- define a usable operating surface
- automate the repetitive thinking
- keep the human in control
- produce an artifact people can use immediately

## Evaluation Criteria

The product is working if it helps the user:

- remember who mattered
- know who to follow up with today
- write faster follow-ups
- identify which companies are pulling signal
- avoid losing warm opportunities after the event

## Future Architecture

```text
Browser UI
  -> local relationship store
  -> deterministic classifier
  -> optional LLM extraction
  -> exports
  -> CRM or spreadsheet sync
```

## Portfolio Read

This repo should tell a hiring manager:

```text
Riley can see an ambiguous workflow, design the product surface, build the first working version, and explain how it becomes a real system.
```

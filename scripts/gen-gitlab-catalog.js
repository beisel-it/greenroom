#!/usr/bin/env node
// Lightweight GitLab catalog generator for MVP

const fs = require("fs");
const path = require("path");

async function main() {
  const groupPath = process.env.GITLAB_GROUP_PATH || "greenroom-mvp";
  const token = process.env.GITLAB_TOKEN;
  const apiBase = "https://gitlab.com/api/v4";

  const url = `${apiBase}/groups/${encodeURIComponent(groupPath)}/projects?per_page=100&order_by=name`;
  const headers = token ? { "PRIVATE-TOKEN": token } : {};

  // Use global fetch if available (Node 18+)
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`GitLab API request failed: ${res.status} ${res.statusText}`);
    process.exit(2);
  }
  const projects = await res.json();
  if (!Array.isArray(projects)) {
    console.error("Unexpected GitLab response: not an array of projects");
    process.exit(3);
  }

  const docs = projects.map((p) => {
    const pathWithNs = p.path_with_namespace || p.path || "gitlab/project";
    // sanitize: replace slashes and non-word chars with dash
    const nameSlug = pathWithNs.replace(/[\\/\s]+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const title = p.name || pathWithNs;
    const description = p.description || "";
    const lines = [
      "apiVersion: backstage.io/v1beta1",
      "kind: Component",
      "metadata:",
      "  name: " + nameSlug,
      "  namespace: gitlab",
      "  title: \"" + title.replace(/\"/g, \') + ",
      

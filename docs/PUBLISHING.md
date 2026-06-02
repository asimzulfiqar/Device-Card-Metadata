# Publishing Device Card Panel

## Before Submission

1. Replace the repository links in `src/plugin.json` if the final GitHub URL differs.
2. Capture branded screenshots for a single card, a card grid, and the options editor. Add the image files under `src/img/screenshots/` and list them in `src/plugin.json`.
3. Run:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm run test:ci
   npm run build
   ```

4. Start the provisioned review environment with `npm run server`. Verify the example dashboard at `http://localhost:3000`.
5. Tag a release such as `v1.0.0`. The release workflow builds the ZIP archive.
6. Validate the archive with Grafana's plugin validator before uploading it.

## Signature Notes

Public plugins are submitted for Grafana review before signing. After approval, create a Grafana Cloud access policy token with the `plugins:write` scope and enable `policy_token` in `.github/workflows/release.yml`.

Do not commit tokens, credentials, or private URLs into panel options or repository files.

## Official References

- [Publish or update a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin)
- [Package a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- [Plugin metadata](https://grafana.com/developers/plugin-tools/reference/plugin-json)

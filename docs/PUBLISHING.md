# Publishing Device Card Panel

## Before Submission

Use [RUN_TEST_USE.md](RUN_TEST_USE.md) for the full local run, test, packaging, validator, and manual browser checklist.

1. Replace the repository links in `src/plugin.json` if the final GitHub URL differs.
2. Capture branded screenshots for the fleet overview, metadata detail, focused options editor, and dark-theme example. The expected paths are already listed in `src/plugin.json` under `src/img/screenshots/`.
3. Run:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm run test:ci
   npm run build
   npm run e2e
   ```

4. Start the provisioned review environment with `npm run server`. Verify the example dashboard at `http://localhost:3000`.
5. Confirm the CI Grafana matrix passes for `10.4.0`, `11.6.0`, and `12.4.0`.
6. Tag a release such as `v1.0.0`. The release workflow builds the ZIP archive.
7. Validate the archive with Grafana's plugin validator before uploading it.

## Signature Notes

Public plugins are submitted for Grafana review before signing. After approval, create a Grafana Cloud access policy token with the `plugins:write` scope and enable `policy_token` in `.github/workflows/release.yml`.

Do not commit tokens, credentials, or private URLs into panel options or repository files.

## Official References

- [Publish or update a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin)
- [Package a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- [Plugin metadata](https://grafana.com/developers/plugin-tools/reference/plugin-json)

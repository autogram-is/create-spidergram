# Build a custom web analysis tool with Spidergram

[Spidergram](https://github.com/autogram-is/spidergram) is a toolkit for crawling and analyzing complex web properties. `create-spidergram` is a quick and easy way to set up a new Spidergram project of your own.

## Usage

1. Ensure you're running NodeJS 18 (`node -v`)
2. Install [ArangoDB](https://arangodb.com) via [direct download](https://www.arangodb.com/download-major/) or [homebrew](https://formulae.brew.sh/formula/arangodb). Alternately, if you've got Docker installed, you can use Spidergram's included docker-compose.yml file to spin up an Arango container for testing and development.
3. Create a new project directory, `cd` into it, and run `npx create-spidergram`. You'll be prompted for the project's name and your choice of project template.
4. Run `npm install`
5. Kick the tires with `npm run crawl <url>`, or dive right in to customizing the project.

## The Templates

- **Boilerplate** is an NPM project that fires up a Spidergram crawler, grabs the contents of one or more sites, and prints out a summary report of their URL structures.
- **Boilerplate (Typescript)** is a Typescript version of Boilerplate, with no other functional differences.
- **Crawl with Report (Typescript)** demonstrates basic data extraction and custom report generation in plaintext and Excel formats.
- **JSON config** uses a static config file to control most Spidergram settings in conjunction with the globally-installed CLI. If you're interested in kicking the tires, just install this one, then `npm install -g spidergram`, `brew install docker-compose`, and `docker-compose up`. You're ready to Spidergram.
- **YAML config** What if Spidergram, but YAML?

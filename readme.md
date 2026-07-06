# Tales Through Things

## Structure

The project contains three main folders:

1. apps: frontend and backend applications
2. hermes: the agent's personality and behavior
3. models: the AI models used in the project

## Dependencies

### Homebrew

To manage easilly the dependancies, the project use homebew as main package manager. 
Install it with the following command:

```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Docker

The project uses Docker. 
Install and open it with the following commands:

```bash
    brew install --cask docker
    open /Applications/Docker.app
```

### Yarn

The project uses yarn. To install it, run the following command:

```bash
    brew install yarn
```

### Ollama

The project uses Ollama to run the AI models. To install it, run the following command:

```bash
    brew install ollama
    launchctl setenv OLLAMA_HOST "0.0.0.0:11434" # Expose Ollama to the host machine
```



## Start the project

```bash
    make init 
    make dev
```
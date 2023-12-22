# aidebugs
<div align="center">
  <div>
    <h1 align="center">aidebugs</h1>
  </div>
	<p>A CLI that debugs error messages produced in your command line by calling an LLM! </p>
	<a href="https://www.npmjs.com/package/aidebugs"><img src="https://img.shields.io/npm/v/aidebugs" alt="Current version"></a>
  <p> Influenced by <a> aicommits! </a href="https://github.com/Nutlope/aicommits"> </p>
</div>

## Setup

> Check your Node.js version with `node --version`. It should be at least v14!

1. Installation:

    ```sh
    npm install -g aidebugs
    ```

2. Get your API key from [OpenAI](https://platform.openai.com/account/api-keys)

    > Note: If you haven't already, you'll have to create an account and set up billing.

3. Set the key so aidebugs can use it:
    ```sh
    aidebugs config --key "<your-api-key>"
    ```

    This will create a `.aidebugs` file in your home directory.

### Upgrading

Check the installed version with:
```
aidebugs --version
```

If it's not the [latest version](https://www.npmjs.com/package/aidebugs), run:
```sh
npm update -g aidebugs
```

## Usage
### Send error message

Utilize the --command flag to specify a command for the terminal to execute. Any error output generated is then fed into the open ai api to get tips and ways to fix it! For example,

```sh
aidebugs --command "npm run dev"
```

Add video here 

### Include files 

You can also include files for added context on understanding your error message using the --file flag. For example, including two files

```sh
aidebugs --command "python3 scripts/script1.py" --file "scripts/script1.py" "scripts/script2.py"
```

Add video here

### Specify file lines

You can also specify a range of file lines to include into your context instead of entire files. For example,

```sh
aidebugs --command "python3 scripts/script1.py" --file "scripts/script1.py:2-2" "scripts/script2.py"
```

## Future Additions

Be able to include custom prompts such as "I expected an output of 4 but got 5- what could the issue be?". And have it debug. 
Or maybe have it include print/logging statements wherever possible. 

Beautify it- would love tips on that! For example, instead of 

Also want to make something that makes file's searchable. I find in my large codebases its difficult. But this may not be the best suited for a command line interface and rather for a text editor like VS code! 


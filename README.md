# caproverapi

![TypeScript](https://badgen.net/badge/TypeScript/strict%20💪/blue)
[![CI](https://github.com/kaaax0815/caproverapi/actions/workflows/ci.yml/badge.svg)](https://github.com/kaaax0815/caproverapi/actions/workflows/ci.yml)
[![deno land](https://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black)](https://deno.land/x/caproverapi)

## Deno API Wrapper around Caprover API

### 💻 First Start

```ts
import CapRover, { PROTOCOLS } from 'https://deno.land/x/caproverapi@v1.0.3/mod.ts'

const capRover = await CapRover.login({
  address: '<your caprover instance>',
  password: '<your caprover password>',
  protocol: PROTOCOLS.'<HTTP or HTTPS>'
});
```

### 🔒 Permissions

It needs the `--allow-net` flag to use the CapRover API

It needs the `--allow-env` flag to enable Logging in Debug Environments

### 🛠️ Logging

Set Environment Variable `DEBUG='*'` to enable logging

### 📝 Documentation

Documentation is available here: <https://doc.deno.land/https/deno.land%2Fx%2Fcaproverapi%2Fmod.ts>

### 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

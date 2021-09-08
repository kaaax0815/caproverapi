# caproverapi

![TypeScript](https://badgen.net/badge/TypeScript/strict%20💪/blue)
[![CI](https://github.com/kaaax0815/caproverapi/actions/workflows/ci.yml/badge.svg)](https://github.com/kaaax0815/caproverapi/actions/workflows/ci.yml)

## Deno API Wrapper around Caprover API

### 💻 First Start

```ts
import CapRover, { PROTOCOLS } from 'https://deno.land/x/caproverapi@v1.0.1/mod.ts'

const capRover = await CapRover.login({
  address: '<your caprover instance>',
  password: '<your caprover password>',
  protocol: PROTOCOLS.'<HTTP or HTTPS>'
});
```

### 🛠️ Logging

Set Environment Variable `DEBUG='*'` to enable logging

### 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

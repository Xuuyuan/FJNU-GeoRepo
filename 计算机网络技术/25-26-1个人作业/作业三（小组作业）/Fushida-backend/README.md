# Fushida-backend

本目录为【福师达】项目的后端部分。后端部分采用 Flask 框架，运行环境为 Python 3.12.7。出于提交文件体积考虑，本目录删除了虚拟环境。项目所使用的相关依赖如下：

```text
flask
flask_cors
flask_jwt_extended
flask_sqlalchemy
requests
pycryptodome
pillow
pyzbar
opencv-python
numpy
```

其中 `pyzbar` 包需要依赖于 Visual C++ 运行库（`Visual C++ Redistributable for Visual Studio 2013` 及以上版本）。建议采用 uv 部署以免环境冲突。
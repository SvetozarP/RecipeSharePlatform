from setuptools import setup, find_packages

setup(
    name="accounts",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'django',
        'djangorestframework',
        'djangorestframework-simplejwt',
    ],
) 
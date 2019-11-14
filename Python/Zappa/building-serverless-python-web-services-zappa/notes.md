Topics will cover:
- Installing and configuring Django
- Designing an image gallery application
- Serving static and media files via AWS Cloudfront CDN
- Setting up static and media files
- Integrating Zappa
- Building, testing and deploying the Django application using Zappa
- Django management command

## Created models and hooked it up to admin tool

## Setup cloudfront

While creating a distribution, Amazon provides two different methods, such as web and
RTMP. The web method is used for static content that needs to be served through the CDN
network and when all static files are residing in an Amazon S3 bucket. The RTMP method
is used to distribute the streaming media files, which allow a user to play the file before it
finishes the download.



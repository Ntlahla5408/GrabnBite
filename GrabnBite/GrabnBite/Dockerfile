FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY GrabnBite/GrabnBite/GrabnBite.csproj GrabnBite/GrabnBite/
RUN dotnet restore GrabnBite/GrabnBite/GrabnBite.csproj

COPY . .
RUN dotnet publish GrabnBite/GrabnBite/GrabnBite.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "GrabnBite.dll"]
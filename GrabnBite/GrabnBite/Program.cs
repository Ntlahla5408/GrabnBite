using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using GrabnBite.Data;
using GrabnBite.Hubs;
using GrabnBite.Configuration;
using GrabnBite.Services;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:10000");
}

builder.Services.Configure<YocoSettings>(builder.Configuration.GetSection("Yoco"));
builder.Services.AddHttpClient<YocoPaymentService>();
builder.Services.AddScoped<FakePaymentGateway>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MyPolicy", builder =>
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader());
});
// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSignalR();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GrabnBite API",
        Version = "v1",
        Description = "GrabnBite Web API"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!
                )
            )
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        // Always verify database connectivity, but never seed demo accounts
        // outside Development. Production databases must be provisioned through
        // controlled deployment/migration processes.
        await db.Database.OpenConnectionAsync();
        app.Logger.LogInformation("Database connectivity check succeeded.");
        await db.Database.CloseConnectionAsync();

        if (app.Environment.IsDevelopment())
        {
            await DbSeeder.SeedAsync(db);
            app.Logger.LogInformation("Development database seeding completed.");
        }
        else
        {
            app.Logger.LogInformation(
                "Database seeding skipped because the application is not running in Development.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(
            ex,
            "Application startup stopped because the database connection or development seeding failed.");

        // Never continue into a partially usable API after a failed DB probe/seed.
        throw;
    }
}

app.UseCors("MyPolicy");

// Keep interactive API documentation available locally, but do not expose
// the Swagger UI and API schema publicly in production by default.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();

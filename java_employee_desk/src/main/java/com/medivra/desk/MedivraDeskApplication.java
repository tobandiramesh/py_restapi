package com.medivra.desk;

import com.medivra.desk.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MedivraDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedivraDeskApplication.class, args);
    }

    @Bean
    CommandLineRunner setupDatabase(EmployeeRepository employeeRepository) {
        return args -> {
            employeeRepository.createTableIfNeeded();
            employeeRepository.seedDataIfEmpty();
        };
    }
}

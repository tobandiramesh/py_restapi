package com.medivra.desk.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Employee {
    private Integer id;
    private String name;
    private String email;
    private Integer salary;
    private String department;
    private String manager;
    @JsonProperty("geo_location")
    private String geoLocation;

    public Employee() {
    }

    public Employee(Integer id, String name, String email, Integer salary, String department, String manager, String geoLocation) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.salary = salary;
        this.department = department;
        this.manager = manager;
        this.geoLocation = geoLocation;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getSalary() {
        return salary;
    }

    public void setSalary(Integer salary) {
        this.salary = salary;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    @JsonProperty("geo_location")
    public String getGeoLocation() {
        return geoLocation;
    }

    @JsonProperty("geo_location")
    public void setGeoLocation(String geoLocation) {
        this.geoLocation = geoLocation;
    }
}
